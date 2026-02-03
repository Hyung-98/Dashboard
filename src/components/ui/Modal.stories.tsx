import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Modal } from "./Modal";

const meta: Meta<typeof Modal> = {
  title: "UI/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "접근성 지원 모달. open/onClose, title, children. ESC로 닫기, 포커스 트랩.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    open: { control: false },
    onClose: { control: false },
    title: { control: "text" },
  },
};
export default meta;

type Story = StoryObj<typeof Modal>;

function ModalTrigger({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        모달 열기
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="모달 제목">
        <p>모달 내용입니다. ESC를 누르거나 배경을 클릭하면 닫힙니다.</p>
      </Modal>
    </>
  );
}

export const Default: Story = {
  render: () => <ModalTrigger />,
};

export const LongContent: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          긴 내용 모달
        </button>
        <Modal open={open} onClose={() => setOpen(false)} title="긴 내용">
          <div style={{ maxHeight: 300, overflow: "auto" }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <p key={i}>긴 내용 라인 {i + 1}. 스크롤 가능합니다.</p>
            ))}
          </div>
        </Modal>
      </>
    );
  },
};
