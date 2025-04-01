import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    supportFile: 'cypress/support/e2e.ts',
  },
  video: false,
  screenshotOnRunFailure: true,
  chromeWebSecurity: false
})