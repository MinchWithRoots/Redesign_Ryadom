/**
 * Maps experience values to Russian text with years
 * @param experience - The experience value ('beginner', 'experienced', or years number)
 * @returns Russian text describing experience
 */
export const getExperienceText = (experience: string | number | undefined): string => {
  if (!experience) return 'Опыт не указан'
  
  const exp = String(experience).toLowerCase()
  
  switch (exp) {
    case 'beginner':
      return 'До 1 года'
    case 'experienced':
      return '2+ года'
    case 'expert':
      return '5+ лет'
    default:
      // If it's already a number or formatted text, return as is
      return String(experience)
  }
}
