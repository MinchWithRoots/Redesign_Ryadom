/**
 * Returns the correct Russian grammatical form for age
 * @param age - The age number
 * @returns 'год' (1), 'года' (2-4), or 'лет' (5-20, 25+)
 */
export const getAgeForm = (age?: number | null): string => {
  if (!age) return ''

  const lastDigit = age % 10
  const lastTwoDigits = age % 100

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return 'год'
  } else if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return 'года'
  } else {
    return 'лет'
  }
}
