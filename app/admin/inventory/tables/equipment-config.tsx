import { type Schema } from '@/amplify/data/resource';
import { ColumnDef } from '@tanstack/react-table'
import { SelectionSet } from 'aws-amplify/api';
import EquipmentActions from './equipment-actions';

const idColumn: ColumnDef<Equipment> = {
    accessorKey: 'id',
    header: 'Equipment ID',
    cell: ({ row }) => row.getValue('id'),
};

const equipmentTypeColumn: ColumnDef<Equipment> = {
    accessorKey: 'Equipment Type',
    header: 'Equipment Type',
    cell: ({ row }) => row.original.equipmentType.name,
};

const notesColumn: ColumnDef<Equipment> = {
    accessorKey: 'notes',
    header: 'Notes',
    cell: ({ row }) => {
        return row.getValue('notes')
    }
};

const accessoriesColumn: ColumnDef<Equipment> = {
    accessorKey: 'accessories',
    header: 'Accessories',
    cell: ({ row }) => {
        return row.original.accessories?.join(',');
    }
};

const actionsColumn: ColumnDef<Equipment> = {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
        return <EquipmentActions equipment={row.original} />;
    },
};

export const equipmentColumns: ColumnDef<Equipment>[] = [
    equipmentTypeColumn,
    idColumn,
    notesColumn,
    accessoriesColumn,
    actionsColumn
];

export const equipmentSelectionSet = ['id', 'accessories', 'notes', 'equipmentTypeId', 'equipmentType.name'] as const;
export type Equipment = SelectionSet<Schema['Equipment']['type'], typeof equipmentSelectionSet>;