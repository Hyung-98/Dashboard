import type { Meta, StoryObj } from "@storybook/react";
import { ExpenseForm } from "./ExpenseForm";
import type { ExpenseWithCategory } from "@/types/domain";

const meta: Meta<typeof ExpenseForm> = {
  title: "Forms/ExpenseForm",
  component: ExpenseForm,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "지출 입력/수정 폼. 카테고리·금액·발생일·메모·예산 연결. Storybook에서는 API 호출 없이 mock 카테고리/예산으로 렌더.",
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

type Story = StoryObj<typeof ExpenseForm>;

export const Empty: Story = {
  args: {},
};

export const WithInitialData: Story = {
  args: {
    initialData: {
      id: "exp-1",
      category_id: "cat-exp-1",
      budget_id: "bud-1",
      amount: 15000,
      occurred_at: "2024-06-15",
      memo: "점심 식사",
      created_at: "2024-06-15T12:00:00Z",
      user_id: null,
      categories: { id: "cat-exp-1", name: "식비", type: "expense" },
    } as ExpenseWithCategory,
  },
};
