// Custom Cypress commands for Metakai Filter Suite

Cypress.Commands.add('uploadImage', (fileName: string) => {
  cy.fixture(fileName, 'base64').then((fileContent) => {
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(fileContent, 'base64'),
      fileName,
      mimeType: 'image/png',
    })
  })
})

Cypress.Commands.add('applyFilter', (filterName: string) => {
  cy.get(`[data-testid="filter-${filterName}"]`).click()
})

declare global {
  namespace Cypress {
    interface Chainable {
      uploadImage(fileName: string): Chainable<void>
      applyFilter(filterName: string): Chainable<void>
    }
  }
}

export {}