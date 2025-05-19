// This is a shim for PDFField
export default class PDFField {
  constructor(name, ref) {
    this.name = name;
    this.ref = ref;
    this.value = '';
    this.defaultAppearance = '';
  }

  // Set the field value
  setValue(value) {
    this.value = value;
    return this;
  }

  // Get the field value
  getValue() {
    return this.value;
  }

  // Get the field name
  getName() {
    return this.name;
  }

  // Set the default appearance
  setDefaultAppearance(appearance) {
    this.defaultAppearance = appearance;
    return this;
  }

  // Get the default appearance
  getDefaultAppearance() {
    return this.defaultAppearance || '/Helv 0 Tf 0 g';
  }


  // Set the field reference
  setRef(ref) {
    this.ref = ref;
    return this;
  }

  // Get the field reference
  getRef() {
    return this.ref;
  }

  // Serialize to a PDF dictionary
  toPDFDictionary() {
    return {
      Type: 'Annot',
      Subtype: 'Widget',
      FT: 'Tx', // Text field
      T: this.name,
      V: this.value,
      DA: this.defaultAppearance || '/Helv 0 Tf 0 g',
      F: 4, // Print flag
      Ff: 0, // No flags
    };
  }

  // Create a new instance (static factory method)
  static create(name, ref) {
    return new PDFField(name, ref);
  }
}
