import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
} from '@mui/material';
import React, { useState } from 'react';
import { injectIntl } from 'react-intl';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import commonStyle from '../../styles/commonStyle';
import './Preview.scss';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.js`;
const componentStyle = {
  headerText: {
    fontFamily: 'Helvetica',
    fontWeight: 700,
  },
  actionBtn: {
    borderTop: '1px solid #E5E5E5',
  },
  loaderStyle: {
    color: 'white',
  },
};

interface IProps {
  intl: any;
  open: boolean;
  pdf?: any;
  onClose: () => void;
}

const Preview: React.FC<IProps> = ({
  intl,
  open,
  pdf = 'https://api.printnode.com/static/test/pdf/multipage.pdf',
  // pdf = 'https://monetizely-contract-template.s3.amazonaws.com/cf25cde4-e692-4d2f-a3d3-38b9df2632f3/53547028-f8e4-471a-886d-439587edfdf4/Doc_quote_test_complex-test-3.pdf?response-content-disposition=inline&response-content-type=application%2Fpdf&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA5HJA34SNZAQHLPXY%2F20230921%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20230921T094915Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=64a1c32d1a7dd323740a08c27b5bb23819ebe602dcef8cf8f75e45124d8a5c6c',
  onClose,
}) => {
  const [numPage, setNumPage] = useState<any>(null);
  const [scale, setScale] = useState(1.5);

  const onDocumentLoadSuccess = ({ numPages }: any) => {
    setNumPage(numPages);
  };

  const zoomIn = () => {
    setScale(scale + 0.2);
  };

  const zoomOut = () => {
    setScale(scale - 0.2);
  };
  return (
    <Dialog open={open} fullWidth maxWidth="lg">
      <DialogTitle>
        <Box sx={componentStyle.headerText}>{intl.formatMessage({ id: 'previewContract' })}</Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box height={500} sx={{ display: 'unset' }}>
          {numPage && (
            <Box className="actions">
              <Stack
                direction="row"
                spacing={2}
                justifyContent="center"
                alignItems="center"
                sx={{ backgroundColor: 'lightgray', borderRadius: '5px' }}>
                <IconButton onClick={zoomIn}>
                  <ZoomInIcon />
                </IconButton>
                <IconButton onClick={zoomOut}>
                  <ZoomOutIcon />
                </IconButton>
              </Stack>
            </Box>
          )}

          <Document
            file={{
              url: pdf,
            }}
            onLoadSuccess={onDocumentLoadSuccess}
            className="document">
            {Array.from({ length: numPage }, (_, index) => index + 1).map((page) => (
              <Page pageNumber={page} renderTextLayer={false} scale={scale} />
            ))}
          </Document>
        </Box>
      </DialogContent>
      <DialogActions sx={componentStyle.actionBtn}>
        <Button onClick={() => onClose()} sx={commonStyle.blueButton}>
          {intl.formatMessage({ id: 'close' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default injectIntl(Preview);
