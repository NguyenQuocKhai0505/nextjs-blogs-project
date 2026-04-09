import { toast } from "sonner"

export async function confirmToast(opts: {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
}): Promise<boolean> {
  const { title, description, confirmText = "Confirm", cancelText = "Cancel" } = opts

  return new Promise((resolve) => {
    toast(title, {
      description,
      action: {
        label: confirmText,
        onClick: () => resolve(true),
      },
      cancel: {
        label: cancelText,
        onClick: () => resolve(false),
      },
      onDismiss: () => resolve(false),
    })
  })
}

