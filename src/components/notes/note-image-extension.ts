import Image from '@tiptap/extension-image'

export const NoteImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      storagePath: {
        default: null,
        keepOnSplit: true,
        parseHTML: (element) => element.getAttribute('data-storage-path'),
        renderHTML: (attributes) => {
          if (!attributes.storagePath) return {}
          return { 'data-storage-path': attributes.storagePath }
        },
      },
    }
  },
})
