'use client'

import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react';
import UpdateEquipmentDialog from '../dialogs/update-equipment-dialog';
import DeleteEquipmentDialog from '../dialogs/delete-equipment-dialog';
import type { Equipment } from './equipment-config';

export default function EquipmentActions({ equipment }: { equipment: Equipment }) {
    const [updateOpen, setUpdateOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger className='fit-content'>
                    <MoreHorizontal className='h-4 w-4' />
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                        onClick={() => navigator.clipboard.writeText(equipment.id)}
                    >
                        Copy ID
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setUpdateOpen(true)}>
                        Update
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setDeleteOpen(true)}>
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <UpdateEquipmentDialog
                equipment={equipment}
                open={updateOpen}
                onOpenChange={setUpdateOpen}
            />
            <DeleteEquipmentDialog
                equipment={equipment}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
            />
        </>
    );
}
