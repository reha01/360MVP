/**
 * Custom ESLint rules to prevent regression
 * 
 * This file contains custom rules to ensure code quality and consistency
 */

module.exports = {
  rules: {
    // Prevent use of 'orgs' collection name - must use 'organizations'
    'no-restricted-syntax': [
      'error',
      {
        selector: "Literal[value=/\\borgs\\b/]",
        message: "Use 'organizations' instead of 'orgs' for Firestore collection names. Import from lib/paths.ts for centralized paths."
      },
      {
        selector: "TemplateElement[value.raw=/\\borgs\\//]",
        message: "Use 'organizations/' instead of 'orgs/' in paths. Import from lib/paths.ts for centralized paths."
      }
    ],
    
    // Prefer centralized path helpers
    'no-restricted-imports': [
      'warn',
      {
        patterns: [
          {
            group: ['**/firebase', '**/firestore'],
            message: "Consider using centralized path helpers from 'lib/paths' instead of direct Firestore references"
          }
        ]
      }
    ]
  }
};
