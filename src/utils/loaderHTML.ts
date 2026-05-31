/**
 * HTML templates for inline loaders without Vue components.
 * Use these in simple loading states where Vue components are overkill.
 */

export const loaderTemplates = {
  // Double border with dots
  dots: `
    <div class="loader-inline">
      <div class="loader-inline__border"></div>
      <div class="loader-inline__dot"></div>
      <div class="loader-inline__dot"></div>
    </div>
  `,

  // Pulse rings
  pulse: `
    <div class="loader-pulse-inline">
      <div class="loader-pulse-inline__ring"></div>
      <div class="loader-pulse-inline__ring"></div>
      <div class="loader-pulse-inline__ring"></div>
    </div>
  `,

  // Bouncing dots
  bounce: `
    <div class="loader-bounce-inline">
      <div class="loader-bounce-inline__dot"></div>
      <div class="loader-bounce-inline__dot"></div>
      <div class="loader-bounce-inline__dot"></div>
    </div>
  `,

  // Gradient spinner
  gradient: `
    <div class="loader-gradient-inline"></div>
  `,

  // Bouncing bars
  bars: `
    <div class="loader-stripe-inline">
      <div class="loader-stripe-inline__bar"></div>
      <div class="loader-stripe-inline__bar"></div>
      <div class="loader-stripe-inline__bar"></div>
    </div>
  `,
}

export function getLoaderHTML(type: keyof typeof loaderTemplates = 'dots'): string {
  return loaderTemplates[type] || loaderTemplates.dots
}

/**
 * Example usage in a component:
 *
 * import { getLoaderHTML } from '@/utils/loaderHTML'
 *
 * // In your HTML template:
 * <div v-html="getLoaderHTML('dots')"></div>
 *
 * // Or create a loading section:
 * <div v-if="isLoading">
 *   <div v-html="getLoaderHTML('pulse')"></div>
 *   <p>Loading data...</p>
 * </div>
 */
