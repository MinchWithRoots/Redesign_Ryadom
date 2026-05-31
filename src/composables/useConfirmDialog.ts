import { ref, computed } from 'vue'

interface ConfirmDialogState {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
  onConfirm?: () => Promise<void> | void
  onCancel?: () => void
}

const state = ref<ConfirmDialogState>({
  isOpen: false,
  title: '',
  message: '',
  confirmText: '✓ Подтвердить',
  cancelText: '✕ Отмена',
  isDangerous: false,
})

export const useConfirmDialog = () => {
  const isOpen = computed(() => state.value.isOpen)
  const title = computed(() => state.value.title)
  const message = computed(() => state.value.message)
  const confirmText = computed(() => state.value.confirmText)
  const cancelText = computed(() => state.value.cancelText)
  const isDangerous = computed(() => state.value.isDangerous)

  const openDialog = (options: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    isDangerous?: boolean
    onConfirm?: () => Promise<void> | void
    onCancel?: () => void
  }) => {
    state.value = {
      isOpen: true,
      ...options,
    }
  }

  const closeDialog = () => {
    state.value.isOpen = false
  }

  const handleConfirm = async () => {
    try {
      if (state.value.onConfirm) {
        await state.value.onConfirm()
      }
    } finally {
      closeDialog()
    }
  }

  const handleCancel = () => {
    if (state.value.onCancel) {
      state.value.onCancel()
    }
    closeDialog()
  }

  return {
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    isDangerous,
    openDialog,
    closeDialog,
    handleConfirm,
    handleCancel,
  }
}
