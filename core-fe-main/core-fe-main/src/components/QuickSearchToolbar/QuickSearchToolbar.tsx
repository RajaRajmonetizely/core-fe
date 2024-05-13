import { IconButton, TextField } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import './QuickSearchToolbar.scss';

interface QuickSearchToolbarProps {
  clearSearch: () => void;
  onChange: () => void;
  value: string;
}

const QuickSearchToolbar = ({ clearSearch, onChange, value }: QuickSearchToolbarProps) => {
  return (
    <div className="root">
      <div />
      <TextField
        variant="standard"
        value={value}
        onChange={onChange}
        placeholder="Search…"
        className="textField"
        InputProps={{
          startAdornment: <SearchIcon fontSize="small" />,
          endAdornment: (
            <IconButton
              title="Clear"
              aria-label="Clear"
              size="small"
              style={{ visibility: value ? 'visible' : 'hidden' }}
              onClick={clearSearch}>
              <ClearIcon fontSize="small" />
            </IconButton>
          ),
        }}
      />
    </div>
  );
};

export default QuickSearchToolbar;
