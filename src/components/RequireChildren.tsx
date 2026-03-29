// components/RequireChildren.tsx
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Navigate } from 'react-router-dom';

const RequireChildren = ({ children }: { children: JSX.Element }) => {
  const childrenList = useSelector((state: RootState) => state.children);
  const hasAtLeastOneChild = childrenList && childrenList?.data.length > 0;

    
  if (!hasAtLeastOneChild) {
    return <Navigate to="/add-child" replace />;
  }
  console.log("Children exist, rendering children");
  return children;
};

export default RequireChildren;
