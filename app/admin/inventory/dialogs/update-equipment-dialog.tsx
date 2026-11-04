'use client'

import useAmplify from '@/app/hooks/use-amplify';
import { AMPLIFY_DATA_LIST_LIMIT } from '@/app/utils/constants';
import generateClient from '@/app/utils/generate-client';
import handleError from '@/app/utils/handle-error';
import UpdateDialog from '@/components/dialogs/update-dialog';
import { DataSelect } from '@/components/primitives/interactions/data-select';
import TextInputList from '@/components/primitives/interactions/text-input-list';
import { TextInputWithLabel } from '@/components/primitives/interactions/text-input-with-label';
import type { Equipment } from '../tables/equipment-config';
import { useEffect, useState } from 'react';

interface UpdateEquipmentDialogProps {
    equipment: Equipment;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function UpdateEquipmentDialog({
    equipment,
    open,
    onOpenChange
}: UpdateEquipmentDialogProps) {
    useAmplify();
    const initialAccessories = (equipment.accessories ?? []).filter((a): a is string => a != null);

    const [equipmentTypeId, setEquipmentTypeId] = useState(equipment.equipmentTypeId);
    const [accessories, setAccessories] = useState<string[]>(initialAccessories);  // optional
    const [notes, setNotes] = useState(equipment.notes ?? '');  // optional

    useEffect(() => {
        if (open) {
            setEquipmentTypeId(equipment.equipmentTypeId);
            setNotes(equipment.notes ?? '');
            // accessories are reset by TextInputList, which remounts with `initialAccessories` each time the dialog opens
        }
    }, [equipment, open]);

    const updateEquipment = async () => {
        const client = generateClient();
        const nonEmptyAccessories = accessories.map(a => a.trim()).filter(a => a != '');
        const result = await client.models.Equipment.update({
            id: equipment.id,
            equipmentTypeId,
            accessories: (nonEmptyAccessories.length > 0 ? nonEmptyAccessories : null),
            notes: (notes.trim().length > 0 ? notes.trim() : null)
        });

        if (result.errors) {
            throw new Error(JSON.stringify(result.errors));
        }

        return true;
    };

    const queryEquipmentTypes = async () => {
        const client = generateClient();
        const result = await client.models.EquipmentType.list({
            selectionSet: ['id', 'name'],
            limit: AMPLIFY_DATA_LIST_LIMIT
        });

        if (result.errors)
            handleError(result.errors);

        return result.data.map((equipmentType) => {
            return {
                label: equipmentType.name,
                value: equipmentType.id
            };
        });
    };

    return (
        <UpdateDialog
            name='Equipment'
            description={`Physical identifier ${equipment.id} cannot be changed.`}
            open={open}
            onOpenChange={onOpenChange}
            onSubmit={updateEquipment}
            canSubmit={equipmentTypeId != ''}
        >
            <DataSelect
                inputID={`equipment-equipment-type-${equipment.id}`}
                label='Equipment Type'
                value={equipmentTypeId}
                queryData={queryEquipmentTypes}
                onChange={setEquipmentTypeId}
            />
            <TextInputList
                inputID={`equipment-accessories-${equipment.id}`}
                label='Accessories'
                isRequired={false}
                initialValues={initialAccessories}
                onChange={setAccessories}
                addButtonLabel='Add accessory'
            />
            <TextInputWithLabel
                inputID={`equipment-notes-${equipment.id}`}
                label='Notes'
                value={notes}
                onChange={setNotes}
                isRequired={false}
            />
        </UpdateDialog>
    );
}
