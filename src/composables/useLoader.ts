import { ref, computed } from 'vue'

type LoaderType = 'dots' | 'path' | 'pulse' | 'gradient' | 'bars' | 'circle'

export function useLoader(defaultMessage = 'Загружается...', loaderType: LoaderType = 'pulse') {
  const isLoading = ref(false)
  const message = ref(defaultMessage)
  const loaderTypeRef = ref(loaderType)

  const start = (customMessage?: string, type?: LoaderType) => {
    message.value = customMessage || defaultMessage
    if (type) loaderTypeRef.value = type
    isLoading.value = true
  }

  const stop = () => {
    isLoading.value = false
  }

  const setMessage = (newMessage: string) => {
    message.value = newMessage
  }

  const setType = (type: LoaderType) => {
    loaderTypeRef.value = type
  }

  return {
    isLoading,
    message,
    loaderType: loaderTypeRef,
    start,
    stop,
    setMessage,
    setType
  }
}

// Global loading state for page-level operations
export const useGlobalLoader = () => {
  const isLoading = ref(false)
  const message = ref('')
  const loaderType = ref<LoaderType>('pulse')
  const progress = ref(0)

  const startLoading = (msg: string = 'Загружается...', type: LoaderType = 'pulse') => {
    message.value = msg
    loaderType.value = type
    isLoading.value = true
    progress.value = 10
  }

  const stopLoading = () => {
    isLoading.value = false
    progress.value = 0
  }

  const updateProgress = (value: number) => {
    progress.value = Math.min(value, 95)
  }

  const complete = () => {
    progress.value = 100
    setTimeout(() => {
      stopLoading()
      progress.value = 0
    }, 300)
  }

  return {
    isLoading: computed(() => isLoading.value),
    message: computed(() => message.value),
    loaderType: computed(() => loaderType.value),
    progress: computed(() => progress.value),
    startLoading,
    stopLoading,
    updateProgress,
    complete
  }
}
