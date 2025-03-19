"use server"

export async function processPdf(formData: FormData): Promise<string> {
  try {
    const file = formData.get("file") as File

    if (!file) {
      throw new Error("No file provided")
    }

    // Get the file name
    const fileName = file.name

    // Return a placeholder that explains the limitations
    return `# ${fileName}

## PDF Content

This is a placeholder for the content of your PDF file "${fileName}".

PDF text extraction is currently limited in this environment. For best results:

1. Copy and paste the text from your PDF into a new document
2. Save it as a Markdown (.md) file
3. Upload the Markdown file instead

Alternatively, you can view the PDF in your preferred PDF reader and reference it while using this application.

### Future Improvements

In a future update, we plan to implement a more robust PDF text extraction solution that works reliably in all environments.`
  } catch (error) {
    console.error("Error processing PDF:", error)
    return "# Error Processing PDF\n\nThere was an error processing your PDF file. Please try again with a different file."
  }
}

