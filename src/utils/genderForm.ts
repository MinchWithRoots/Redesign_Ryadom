/**
 * Convert gender value to Russian text
 * @param gender - Gender value (can be 'male', 'female', 'Мужчина', 'Женщина', or undefined)
 * @returns Russian gender text
 */
export const getGenderInRussian = (gender: string | undefined): string => {
  if (!gender) return 'Не указан'
  
  const lowerGender = gender.toLowerCase().trim()
  
  // Handle English values
  if (lowerGender === 'male' || lowerGender === 'мужчина') {
    return 'Мужчина'
  }
  if (lowerGender === 'female' || lowerGender === 'женщина') {
    return 'Женщина'
  }
  
  // If it's already in Russian or unknown, return as is
  return gender
}
