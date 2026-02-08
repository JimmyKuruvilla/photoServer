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
    // it's just a config problem. Need to set the printer in cups. 
    const { stdout, stderr } = await execAsync(`PRINTER="HL-2270DW" lpr "${filepath}"`);
    // const { stdout, stderr } = await execAsync(`cat "${filepath}" > /dev/tcp/192.168.2.111/9100`);
    console.log(stdout, stderr);
  } catch (error) {
    throw new Error(`PRINT_ERROR: ${(error as any).stderr}`);
  }
};
