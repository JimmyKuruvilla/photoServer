const child_process = require('child_process')
const util = require('util');
const exec = util.promisify(child_process.exec)

const printPage = () => `
<html>
<body>
<form action="/print/upload" method="post" enctype="multipart/form-data">
<input type="file" name="fileToPrint"/>
<input type="submit" value="Print">  
</form>
</body>
</html>
`

const printFile = async (filepath) => {
  try {
    const { stdout, stderr } = await exec(`lpr "${filepath}"`)
    console.log(stdout, stderr)
  } catch (error) {
    throw new Error(`PRINT_ERROR: ${stderr}`, { cause: error })
  }
}

module.exports = {
    printPage,
    printFile
}