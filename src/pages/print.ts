import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const printPage = (): string => `
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
    const { stdout, stderr } = await execAsync(`lpr "${filepath}"`);
    console.log(stdout, stderr);
  } catch (error) {
    throw new Error(`PRINT_ERROR: ${(error as any).stderr}`);
  }
};
