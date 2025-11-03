/**
 * Helper for making Elements with attributes
 * @param tagName           - new Element tag name
 * @param classNames  - list or name of CSS class
 * @param attributes        - any attributes
 * @returns HTMLElement with applied classes and attributes
 */
export function make(tagName: string, classNames: string[] | string | null = null, attributes: { [key: string]: string | boolean } = {}): HTMLElement {
  const el = document.createElement(tagName);

  if (Array.isArray(classNames)) {
    el.classList.add(...classNames);
  } else if (classNames !== null) {
    el.classList.add(classNames);
  }

  for (const attrName in attributes) {
    if (Object.prototype.hasOwnProperty.call(attributes, attrName)) {
      (el as HTMLElement & Record<string, string | boolean>)[attrName] = attributes[attrName];
    }
  }

  return el;
}
