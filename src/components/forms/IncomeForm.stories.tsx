import type { Meta, StoryObj } from "@storybook/react";
import { IncomeForm } from "./IncomeForm";
import type { IncomeWithCategory } from "@/types/domain";

const meta: Meta<typeof IncomeForm> = {
  title: "Forms/IncomeForm",
  component: IncomeForm,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "수입 입력/수정 폼. 카테고리·금액·발생일·메모. Storybook에서는 API 호출 없이 mock 카테고리로 렌더.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    initialData: { control: false },
    onSuccess: { action: "onSuccess" },
  },
};
export default meta;

type Story = StoryObj<typeof IncomeForm>;

export const Empty: Story = {
  args: {},
};

export const WithInitialData: Story = {
  args: {
    initialData: {
      id: "inc-1",
      category_id: "cat-inc-1",
      amount: 3000000,
      occurred_at: "2024-06-01",
      memo: "월급",
      created_at: "2024-06-01T09:00:00Z",
      user_id: null,
      categories: { id: "cat-inc-1", name: "월급", type: "income" },
    } as IncomeWithCategory,
  },
};
