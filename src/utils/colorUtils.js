// src/utils/colorUtils.js

## Use a few key theme colors for the tags
const tagColorVariables = [
  '--color-primary',
  '--color-secondary',
  '--color-accent',
  // Add more variables here if needed, ensuring they contrast well with white text
  // E.g., derive slightly darker/lighter shades if the main ones don't work well.
  // For now, sticking to the main three.
];

## Assigns a consistent color variable based on the category name's position
export const getTagColor = (categoryName, allCategories) => {
  if (!categoryName || !allCategories || allCategories.length === 0) {
    ## Default or fallback color if category is missing or list is empty
    return `var(${tagColorVariables[1]})`; // Default to secondary color
  }

  ## Ensure 'Uncategorized' gets a specific, consistent color (e.g., grey)
  if (categoryName === 'Uncategorized') {
      return 'var(--color-completed)'; // Use the greyish 'completed' color
  }

  ## Sort categories alphabetically to ensure stable index assignment
  const sortedCategories = [...allCategories]
      .filter(cat => cat !== 'Uncategorized') // Exclude 'Uncategorized' from colored cycle
      .sort();

  const index = sortedCategories.indexOf(categoryName);

  if (index === -1) {
    ## Handle cases where category might not be in the main list (shouldn't happen often)
    return `var(${tagColorVariables[1]})`; // Default to secondary
  }

  ## Cycle through the available color variables
  const colorIndex = index % tagColorVariables.length;
  return `var(${tagColorVariables[colorIndex]})`;
}; 