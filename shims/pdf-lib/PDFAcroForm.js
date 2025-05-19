// This is a shim for PDFAcroForm
export default class PDFAcroForm {
  constructor() {
    this.fields = [];
    this.defaultAppearance = '';
  }

  // Add a field to the form
  addField(field) {
    this.fields.push(field);
    return this;
  }

  // Get field by name
  getField(name) {
    return this.fields.find(field => field.getName() === name);
  }

  // Get all fields
  getFields() {
    return this.fields;
  }

  // Set default appearance
  setDefaultAppearance(appearance) {
    this.defaultAppearance = appearance;
    return this;
  }

  // Get default appearance
  getDefaultAppearance() {
    return this.defaultAppearance;
  }

  // Serialize to PDF dictionary
  toPDFDictionary() {
    return {
      Type: 'AcroForm',
      Fields: this.fields.map(field => field.getRef()),
      DA: this.defaultAppearance || '/Helv 0 Tf 0 g'
    };
  }

  // Create a new instance (static factory method)
  static create() {
    return new PDFAcroForm();
  }
}
