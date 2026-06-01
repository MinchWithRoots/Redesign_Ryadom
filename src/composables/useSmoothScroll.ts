import { onMounted } from 'vue'

export function useSmoothScroll() {
  const scrollToElement = (elementId: string, offset: number = 80) => {
    return new Promise<void>((resolve) => {
      const element = document.getElementById(elementId)
      if (!element) {
        console.warn(`Element with id "${elementId}" not found`)
        resolve()
        return
      }

      const elementPosition = element.getBoundingClientRect().top + window.scrollY - offset
      
      // Use smooth scroll behavior
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })

      // Resolve after scroll animation completes (approximate)
      setTimeout(() => resolve(), 1000)
    })
  }

  const handleAnchorClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    
    // Check if clicked element is a link with hash
    const link = target.closest('a[href*="#"]') as HTMLAnchorElement
    if (!link) return

    const hash = link.getAttribute('href')
    if (!hash || !hash.includes('#')) return

    const sectionId = hash.slice(1)
    if (!sectionId) return

    event.preventDefault()
    scrollToElement(sectionId)
  }

  onMounted(() => {
    // Add event listener for smooth scroll on anchor clicks
    document.addEventListener('click', handleAnchorClick)
  })

  return {
    scrollToElement
  }
}
