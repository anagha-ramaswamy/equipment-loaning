'use client'

import useAmplify from '@/app/hooks/use-amplify';
import generateClient from '@/app/utils/generate-client';
import handleError from '@/app/utils/handle-error';
import DeleteDialog from '@/components/dialogs/delete-dialog';
import type { Equipment } from '../tables/equipment-config';
import { useCallback, useEffect, useState } from 'react';

interface DeleteEquipmentDialogProps {
    equipment: Equipment;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface EquipmentReferences {
    hasActiveAssignment: boolean;
    pastAssignmentCount: number;
    periodIds: string[];
}

export default function DeleteEquipmentDialog({
    equipment,
    open,
    onOpenChange
}: DeleteEquipmentDialogProps) {
    useAmplify();
    const [references, setReferences] = useState<EquipmentReferences | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [checkFailed, setCheckFailed] = useState(false);

    const getReferences = useCallback(async (): Promise<EquipmentReferences> => {
        const client = generateClient();
        const result = await client.models.Equipment.get({ id: equipment.id }, {
            selectionSet: ['assignment.id', 'pastAssignments.id', 'periods.periodId']
        });

        if (result.errors) {
            throw new Error(JSON.stringify(result.errors));
        }
        if (!result.data) {
            throw new Error(`Equipment ${equipment.id} not found`);
        }

        return {
            hasActiveAssignment: !!result.data.assignment,
            pastAssignmentCount: result.data.pastAssignments.length,
            periodIds: result.data.periods.map(p => p.periodId)
        };
    }, [equipment.id]);

    useEffect(() => {
        if (!open) {
            return;
        }

        let isCurrent = true;
        setIsChecking(true);
        setCheckFailed(false);
        setReferences(null);

        getReferences()
            .then(refs => {
                if (isCurrent) {
                    setReferences(refs);
                }
            })
            .catch(error => {
                if (isCurrent) {
                    handleError(error);
                    setCheckFailed(true);
                }
            })
            .finally(() => {
                if (isCurrent) {
                    setIsChecking(false);
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [getReferences, open]);

    const isBlocked = (refs: EquipmentReferences) => refs.hasActiveAssignment || refs.pastAssignmentCount > 0;

    const deleteEquipment = async () => {
        // Re-check in case the equipment was assigned since the dialog was opened
        const refs = await getReferences();
        setReferences(refs);
        if (isBlocked(refs)) {
            return false;
        }

        const client = generateClient();

        // Remove the equipment from every period's loanable list first, so periods don't reference missing equipment
        const periodEquipmentResults = await Promise.all(refs.periodIds.map(periodId =>
            client.models.PeriodEquipment.delete({ equipmentId: equipment.id, periodId })
        ));
        for (const { errors } of periodEquipmentResults) {
            if (errors) {
                throw new Error(JSON.stringify(errors));
            }
        }

        const result = await client.models.Equipment.delete({ id: equipment.id });
        if (result.errors) {
            throw new Error(JSON.stringify(result.errors));
        }

        return true;
    };

    return (
        <DeleteDialog
            name='Equipment'
            description={`Are you sure you want to delete ${equipment.id} (${equipment.equipmentType.name})? This action cannot be undone.`}
            open={open}
            onOpenChange={onOpenChange}
            onSubmit={deleteEquipment}
            canSubmit={!isChecking && !checkFailed && references !== null && !isBlocked(references)}
        >
            {isChecking && <p>Checking equipment assignments...</p>}
            {!isChecking && checkFailed && (
                <p role='alert'>Equipment assignments could not be verified. Deletion is disabled.</p>
            )}
            {!isChecking && references?.hasActiveAssignment && (
                <p role='alert'>
                    This equipment is currently assigned to a request. It must be returned before it can be deleted.
                </p>
            )}
            {!isChecking && references && !references.hasActiveAssignment && references.pastAssignmentCount > 0 && (
                <p role='alert'>
                    This equipment has {references.pastAssignmentCount} past {references.pastAssignmentCount === 1 ? 'loan' : 'loans'}.
                    Deleting it would erase those records, so deletion is disabled.
                </p>
            )}
            {!isChecking && references && !isBlocked(references) && references.periodIds.length > 0 && (
                <p>
                    It will also be removed from {references.periodIds.length} loaning {references.periodIds.length === 1 ? 'period' : 'periods'}.
                </p>
            )}
        </DeleteDialog>
    );
}
