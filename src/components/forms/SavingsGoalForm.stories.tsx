import type { Meta, StoryObj } from "@storybook/react";
import { SavingsGoalForm } from "./SavingsGoalForm";
import type { SavingsGoal } from "@/api/savingsGoals";

const meta: Meta<typeof SavingsGoalForm> = {
  title: "Forms/SavingsGoalForm",
  component: SavingsGoalForm,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "저축 목표 입력/수정 폼. 목표명·목표금액·현재금액·목표일. Storybook에서는 API 호출 없이 폼만 렌더.",
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

type Story = StoryObj<typeof SavingsGoalForm>;

export const Empty: Story = {
  args: {},
};

export const WithInitialData: Story = {
  args: {
    initialData: {
      id: "goal-1",
      user_id: "user-1",
      name: "여행 자금",
      target_amount: 5000000,
      current_amount: 1200000,
      target_date: "2025-12-31",
      created_at: "2024-06-15T12:00:00Z",
      updated_at: "2024-06-15T12:00:00Z",
    } as SavingsGoal,
  },
};
