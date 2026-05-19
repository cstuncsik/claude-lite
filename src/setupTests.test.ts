import '@testing-library/jest-dom';
import { screen } from '@testing-library/dom';

describe('setupTests.ts configuration', () => {
  // Test that the jest-dom matchers are available
  test('toHaveTextContent matcher should be available', () => {
    // Create a temporary element to test the matcher
    document.body.innerHTML = '<div>Test content</div>';
    const element = document.querySelector('div');
    
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Test content');
  });

  test('toBeInTheDocument matcher should be available', () => {
    // Create a temporary element to test the matcher
    document.body.innerHTML = '<span>Sample text</span>';
    const element = document.querySelector('span');
    
    expect(element).toBeInTheDocument();
  });

  test('toHaveAttribute matcher should be available', () => {
    // Create a temporary element to test the matcher
    document.body.innerHTML = '<a href="https://example.com">Link</a>';
    const element = document.querySelector('a');
    
    expect(element).toHaveAttribute('href', 'https://example.com');
  });

  test('toHaveClass matcher should be available', () => {
    // Create a temporary element to test the matcher
    document.body.innerHTML = '<div class="test-class another-class">Content</div>';
    const element = document.querySelector('div');
    
    expect(element).toHaveClass('test-class');
    expect(element).toHaveClass('another-class');
    expect(element).toHaveClass('test-class', 'another-class');
  });

  test('toHaveStyle matcher should be available', () => {
    // Create a temporary element to test the matcher
    document.body.innerHTML = '<div style="color: red; font-size: 16px;">Styled div</div>';
    const element = document.querySelector('div');

    // Test with CSS string - browser may convert 'red' to 'rgb(255, 0, 0)'
    expect(element).toHaveStyle('font-size: 16px');
    expect(element).toHaveStyle({
      'font-size': '16px'
    });
  });

  test('toBeVisible matcher should be available', () => {
    // Create temporary elements to test the matcher
    document.body.innerHTML = `
      <div id="visible">Visible content</div>
      <div id="hidden" style="display: none;">Hidden content</div>
    `;
    
    const visibleElement = document.getElementById('visible');
    const hiddenElement = document.getElementById('hidden');
    
    expect(visibleElement).toBeVisible();
    expect(hiddenElement).not.toBeVisible();
  });

  test('toHaveFocus matcher should be available', () => {
    // Create a temporary input to test the matcher
    document.body.innerHTML = '<input id="test-input" />';
    const inputElement = document.getElementById('test-input') as HTMLInputElement;
    
    // Focus the element
    inputElement.focus();
    
    expect(inputElement).toHaveFocus();
  });

  test('toBeDisabled/toBeEnabled matchers should be available', () => {
    // Create temporary elements to test the matchers
    document.body.innerHTML = `
      <button id="enabled-btn">Enabled</button>
      <button id="disabled-btn" disabled>Disabled</button>
    `;
    
    const enabledBtn = document.getElementById('enabled-btn');
    const disabledBtn = document.getElementById('disabled-btn');
    
    expect(enabledBtn).not.toBeDisabled();
    expect(disabledBtn).toBeDisabled();
    
    expect(enabledBtn).toBeEnabled();
    expect(disabledBtn).not.toBeEnabled();
  });

  test('toContainElement matcher should be available', () => {
    // Create temporary elements to test the matcher
    document.body.innerHTML = `
      <div id="parent">
        <span id="child">Child element</span>
      </div>
    `;
    
    const parentElement = document.getElementById('parent');
    const childElement = document.getElementById('child');
    
    expect(parentElement).toContainElement(childElement);
  });

  test('toHaveValue matcher should be available', () => {
    // Create temporary input elements to test the matcher
    document.body.innerHTML = `
      <input id="text-input" value="test value" />
      <select id="select-element">
        <option value="option1">Option 1</option>
        <option value="option2" selected>Option 2</option>
      </select>
    `;
    
    const textInput = document.getElementById('text-input') as HTMLInputElement;
    const selectElement = document.getElementById('select-element') as HTMLSelectElement;
    
    expect(textInput).toHaveValue('test value');
    expect(selectElement).toHaveValue('option2');
  });
});