import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { bootstrapAuth, selectAuthBootstrapped } from '../../store/slices/authSlice.js';

export function AuthBootstrap({ children }) {
  const dispatch = useDispatch();
  const bootstrapped = useSelector(selectAuthBootstrapped);
  const didBootstrap = useRef(false);

  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;
    dispatch(bootstrapAuth());
  }, [dispatch]);

  if (!bootstrapped) return null;

  return children;
}

AuthBootstrap.propTypes = {
  children: PropTypes.node.isRequired,
};
