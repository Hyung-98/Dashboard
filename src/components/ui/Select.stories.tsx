import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Select, type SelectOption } from "./Select";

const options: SelectOption[] = [
  { value: "food", label: "식비" },
  { value: "transport", label: "교통" },
  { value: "shopping", label: "쇼핑" },
  { value: "etc", label: "기타" },
];

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "단일/다중 선택. options, value/onChange, 검색 가능 옵션(searchable).",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    value: { control: false },
    onChange: { control: false },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    multiple: { control: "boolean" },
    searchable: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<typeof Select>;

function SingleSelectDemo() {
  const [value, setValue] = useState<string | null>(null);
  return <Select options={options} value={value} onChange={setValue} placeholder="카테고리 선택" />;
}

export const Single: Story = {
  render: () => <SingleSelectDemo />,
};

export const Multiple: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <Select<string>
        options={options}
        value={value}
        onChange={(v) => setValue(v)}
        placeholder="여러 개 선택"
        multiple
      />
    );
  },
};

export const Disabled: Story = {
  render: () => <Select options={options} value={null} onChange={() => {}} placeholder="비활성" disabled />,
};

export const Searchable: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return <Select options={options} value={value} onChange={setValue} placeholder="검색하여 선택" searchable />;
  },
};
