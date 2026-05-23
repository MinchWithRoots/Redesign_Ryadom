/**
 * Maps experience values to Russian text with years
 * @param experience - The experience value ('до года', '1-3 года', 'более 3 лет' or legacy 'beginner', 'intermediate', 'expert')
 * @returns Russian text describing experience
 */
export const getExperienceText = (experience: string | number | undefined): string => {
  if (!experience) return 'Опыт не указан'

  const exp = String(experience).toLowerCase().trim()

  switch (exp) {
    case 'beginner':
      return 'До 1 года'
    case 'intermediate':
      return '1–3 года'
    case 'expert':
      return '3+ лет'
    case 'до года':
      return 'До 1 года'
    case '1-3 года':
      return '1–3 года'
    case 'более 3 лет':
      return '3+ лет'
    default:
      // If it's already a number or formatted text, return as is
      return String(experience)
  }
}
