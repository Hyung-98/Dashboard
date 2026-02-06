import type { Meta, StoryObj } from "@storybook/react";
import { StockTransactionForm } from "./StockTransactionForm";

const meta: Meta<typeof StockTransactionForm> = {
  title: "Forms/StockTransactionForm",
  component: StockTransactionForm,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "주식 거래 입력 폼. 종목코드·시장(KR/US)·매수/매도·수량·단가·거래일·메모. Storybook에서는 API 호출 없이 폼만 렌더.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    onSuccess: { action: "onSuccess" },
  },
};
export default meta;

type Story = StoryObj<typeof StockTransactionForm>;

export const Default: Story = {
  args: {},
};
