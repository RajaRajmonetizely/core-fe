import { Box } from '@mui/material';
import React, { ReactElement } from 'react';
import './CodeEditor.scss';
import Editor from '@monaco-editor/react';

interface IProps {
  code: string;
  setCodeData: any;
}

const CodeEditor: React.FC<IProps> = ({ code, setCodeData }): ReactElement => {
  const [state, setState] = React.useState(code);

  const handleEditorChange = (value: any) => {
    setState(value);
    setCodeData(value);
  };
  return (
    <Box className="codeBox">
      <Editor
        height="45vh"
        defaultLanguage="python"
        theme="vs-dark"
        defaultValue={state}
        onChange={handleEditorChange}
        options={{
          cursorStyle: 'line',
          formatOnPaste: true,
          formatOnType: true,
          wordWrap: 'on',
          fontSize: 16,
        }}
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onMount={(editor: any, monaco) => {
          if (editor) {
            setTimeout(() => {
              if (editor) editor.getAction('editor.action.formatDocument').run();
            }, 300);
          }
        }}
      />
    </Box>
  );
};

export default CodeEditor;
