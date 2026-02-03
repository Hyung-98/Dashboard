import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DateRangePicker } from "./DateRangePicker";

const meta: Meta<typeof DateRangePicker> = {
  title: "UI/DateRangePicker",
  component: DateRangePicker,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "시작일/종료일 선택. value/onChange (필터용).",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    from: { control: "text" },
    to: { control: "text" },
    onChange: { control: false },
    disabled: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<typeof DateRangePicker>;

function DateRangeDemo() {
  const [from, setFrom] = useState("2025-01-01");
  const [to, setTo] = useState("2025-01-31");
  return (
    <DateRangePicker
      from={from}
      to={to}
      onChange={(f, t) => {
        setFrom(f);
        setTo(t);
      }}
    />
  );
}

export const Default: Story = {
  render: () => <DateRangeDemo />,
};

export const Disabled: Story = {
  args: {
    from: "2025-01-01",
    to: "2025-01-31",
    onChange: () => {},
    disabled: true,
  },
};
