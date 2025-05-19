// This is a shim for PDFAcroTerminal
export default class PDFAcroTerminal {
  constructor() {
    // Add any necessary properties
    this.fields = [];
  }

  // Add a field to the terminal
  addField(field) {
    this.fields.push(field);
    return this;
  }

  // Get all fields
  getFields() {
    return this.fields;
  }

  // Set a field value
  setFieldValue(name, value) {
    const field = this.fields.find(f => f.getName() === name);
    if (field) {
      field.setValue(value);
    }
    return this;
  }

  // Get a field value
  getFieldValue(name) {
    const field = this.fields.find(f => f.getName() === name);
    return field ? field.getValue() : null;
  }

  // Serialize the terminal to a PDF dictionary
  toPDFDictionary() {
    // Return a minimal PDF dictionary
    return {
      Type: 'AcroForm',
      Fields: this.fields.map(field => field.toPDFDictionary())
    };
  }

  // Create a new instance (static factory method)
  static create() {
    return new PDFAcroTerminal();
  }
}
