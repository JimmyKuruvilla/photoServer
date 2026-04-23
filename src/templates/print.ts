import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const PrintPage = (): string => `
<html>
<body>
<form action="/print/upload" method="post" enctype="multipart/form-data">
<input type="file" name="fileToPrint"/>
<input type="submit" value="Print">  
</form>
</body>
</html>
`;

export const printFile = async (filepath: string): Promise<void> => {
  try {
    // lpstat -p -d should output the printer queue name
    const { stdout, stderr } = await execAsync(`lpr -P "ModBrother_HL-2270DW_series" "${filepath}"`);
    console.log(stdout, stderr);
  } catch (error) {
    throw new Error(`PRINT_ERROR: ${(error as any).stderr}`);
  }
};
