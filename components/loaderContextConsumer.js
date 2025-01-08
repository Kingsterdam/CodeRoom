
// components/LoaderContextConsumer.js
'use client';
import React from 'react';
import { useLoader } from '../context/loadingContext';
import Loader from './loader';

export const LoaderContextConsumer = () => {
  const { isLoading } = useLoader();
  return isLoading ? <Loader /> : null;
};