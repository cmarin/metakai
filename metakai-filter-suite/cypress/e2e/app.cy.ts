describe('Metakai Filter Suite E2E', () => {
  beforeEach(() => {
    cy.visit('/')
  })
  
  it('should display the main toolbar', () => {
    cy.contains('Metakai Filter Suite').should('be.visible')
    cy.get('label').contains('Upload Image').should('be.visible')
  })
  
  it('should show filter buttons', () => {
    cy.get('[data-testid="filter-liquify"]').should('be.visible').contains('Liquify')
    cy.get('[data-testid="filter-convolve"]').should('be.visible').contains('Convolve')
    cy.get('[data-testid="filter-gel-paint"]').should('be.visible').contains('Gel Paint')
  })
  
  it('should show control panel when filter is selected', () => {
    // Initially shows placeholder
    cy.contains('Select a filter to see controls').should('be.visible')
    
    // Click Liquify filter
    cy.get('[data-testid="filter-liquify"]').click()
    
    // Should show Liquify controls
    cy.contains('h2', 'Liquify').should('be.visible')
    cy.contains('Brush Size').should('be.visible')
    cy.contains('Pressure').should('be.visible')
    cy.contains('Mode').should('be.visible')
    cy.contains('Strength').should('be.visible')
  })
  
  it('should switch between filters', () => {
    // Select Liquify
    cy.get('[data-testid="filter-liquify"]').click()
    cy.contains('h2', 'Liquify').should('be.visible')
    
    // Switch to Convolve
    cy.get('[data-testid="filter-convolve"]').click()
    cy.contains('h2', 'Convolve').should('be.visible')
    cy.contains('Preset').should('be.visible')
    cy.contains('Intensity').should('be.visible')
  })
  
  it('should handle file upload', () => {
    // Create a test image file
    cy.fixture('test-image.png', 'base64').then((fileContent) => {
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from(fileContent, 'base64'),
        fileName: 'test-image.png',
        mimeType: 'image/png',
      }, { force: true })
    })
    
    // Verify canvas is rendered (would need more specific checks in real app)
    cy.get('canvas').should('be.visible')
  })
  
  it('should respect dark mode preference', () => {
    // Check initial light mode
    cy.get('html').should('not.have.class', 'dark')
    
    // This would require mocking the media query or adding a theme toggle button
  })
})