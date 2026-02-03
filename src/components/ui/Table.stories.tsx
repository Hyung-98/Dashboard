import type { Meta, StoryObj } from "@storybook/react";
import { Table, type Column } from "./Table";

interface SampleRow {
  id: string;
  name: string;
  amount: number;
  date: string;
}

const sampleData: SampleRow[] = [
  { id: "1", name: "식비", amount: 45000, date: "2025-01-15" },
  { id: "2", name: "교통", amount: 12000, date: "2025-01-14" },
  { id: "3", name: "쇼핑", amount: 89000, date: "2025-01-13" },
];

const columns: Column<SampleRow>[] = [
  { key: "name", header: "항목", sortable: true },
  {
    key: "amount",
    header: "금액",
    sortable: true,
    render: (row) => row.amount.toLocaleString() + "원",
  },
  { key: "date", header: "날짜", sortable: true },
];

const meta: Meta<typeof Table<SampleRow>> = {
  title: "UI/Table",
  component: Table,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "재사용 가능한 테이블. columns(컬럼 정의), data, loading, emptyMessage, 정렬/행 클릭 콜백 지원.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    loading: { control: "boolean" },
    emptyMessage: { control: "text" },
  },
};
export default meta;

type Story = StoryObj<typeof Table<SampleRow>>;

export const Default: Story = {
  args: {
    columns,
    data: sampleData,
    getRowKey: (row) => row.id,
  },
};

export const Loading: Story = {
  args: {
    columns,
    data: [],
    loading: true,
    getRowKey: (row) => row.id,
  },
};

export const Empty: Story = {
  args: {
    columns,
    data: [],
    emptyMessage: "등록된 지출이 없습니다.",
    getRowKey: (row) => row.id,
  },
};

export const WithSort: Story = {
  args: {
    columns,
    data: sampleData,
    sortKey: "amount",
    sortDirection: "desc",
    onSort: (key) => console.log("Sort:", key),
    getRowKey: (row) => row.id,
  },
};
