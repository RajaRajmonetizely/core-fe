import React from 'react';
import PersonIcon from '@mui/icons-material/Person';
import { Box } from '@mui/material';
import moment from 'moment';
import { useSelector } from 'react-redux';
import CloseIcon from '@mui/icons-material/Close';
import { injectIntl } from 'react-intl';
import commonStyle from '../../styles/commonStyle';

interface IProps {
  comments: any;
  intl: any;
  onClose: () => void;
}

const componentStyle = {
  mainContainer: {
    minWidth: '420px',
    padding: '28px',
  },
  commentSection: {
    marginBottom: '28px',
  },
  headerTitle: {
    color: 'rgba(59, 63, 77, 1)',
    fontFamily: 'Helvetica',
    fontStyle: 'normal',
    fontWeight: 600,
    fontSize: '1.2rem',
  },
  circle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 181, 70, 1)',
  },
  personIcon: {
    color: 'white',
    marginLeft: '8px',
    marginTop: '6px',
  },
  commentStyle: {
    color: 'rgba(59, 63, 77, 1)',
    fontFamily: 'Helvetica',
    fontStyle: 'normal',
    fontWeight: 400,
    marginTop: '15px',
  },
  name: {
    color: 'rgba(87, 96, 121, 1)',
    fontFamily: 'Helvetica',
    fontStyle: 'normal',
    fontWeight: 600,
  },
  dateStyle: {
    color: 'rgba(0, 0, 0, 0.25)',
    fontFamily: 'Helvetica',
    fontStyle: 'normal',
    fontWeight: 600,
    marginTop: '3px',
  },
  rightContainer: {
    marginLeft: '8px',
  },
  leftContainer: {
    marginRight: '8px',
    marginLeft: 'auto',
  },
  rightComment: {
    textAlign: 'right',
  },
  headerContainer: {
    display: 'flex',
    padding: '20px 28px',
    borderBottom: '1px solid rgba(227, 226, 226, 1)',
  },
  closeIconStyle: {
    marginLeft: 'auto',
    cursor: 'pointer',
  },
};

const CommentLists: React.FC<IProps> = ({ intl, comments, onClose }) => {
  const userId = useSelector((state: any) => state.auth.userId);

  const personIcon = () => {
    return (
      <Box sx={componentStyle.circle}>
        <PersonIcon sx={componentStyle.personIcon} />
      </Box>
    );
  };

  const commentItem = (comment: any) => {
    return (
      <Box sx={commonStyle.displayFlex}>
        {comment.user_id === userId ? personIcon() : null}
        <Box
          sx={
            comment.user_id === userId
              ? componentStyle.rightContainer
              : componentStyle.leftContainer
          }>
          <Box sx={componentStyle.name}>{comment.name}</Box>
          <Box sx={componentStyle.dateStyle}>{moment(comment.created_on).fromNow()}</Box>
        </Box>
        {comment.user_id !== userId ? personIcon() : null}
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={componentStyle.headerContainer}>
        <Box sx={componentStyle.headerTitle}>{intl.formatMessage({ id: 'comments' })}</Box>
        <CloseIcon onClick={onClose} sx={componentStyle.closeIconStyle} />
      </Box>

      <Box sx={componentStyle.mainContainer}>
        {comments.map((comment: any) => {
          return (
            <Box sx={componentStyle.commentSection} key={comment.id}>
              {commentItem(comment)}
              <Box
                sx={[
                  componentStyle.commentStyle,
                  comment.user_id === userId ? {} : componentStyle.rightComment,
                ]}>
                {comment.comment}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default injectIntl(CommentLists);
