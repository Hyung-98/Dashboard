import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton, TableSkeleton, CardSkeleton } from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "테이블/카드/차트용 스켈레톤 블록. 로딩 UI에 사용.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    width: { control: "text" },
    height: { control: "number" },
    borderRadius: { control: "number" },
  },
};
export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: {
    width: 200,
    height: 20,
    borderRadius: 4,
  },
};

export const TableSkeletonStory: Story = {
  render: () => <TableSkeleton rows={5} cols={4} />,
  parameters: {
    docs: {
      description: {
        story: "테이블 형태 스켈레톤.",
      },
    },
  },
};

export const CardSkeletonStory: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "카드 형태 스켈레톤.",
      },
    },
  },
};
