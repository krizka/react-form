/* ---------- Imports ---------- */

// Import React
import React from 'react';
import _ from 'underscore';

// Inport the form input
import FormField from '../FormField';

const NestedFormWrapper = (props) => {

  const {
    children,
    fieldApi
  } = props;

  const {
    setValue,
    getValue,
    setError,
    setWarning,
    setSuccess,
    getTouched,
    setTouched,
    submitted,
    submits,
    validatingField,
    doneValidatingField,
    registerAsyncValidation,
    reset
  } = fieldApi;

  return React.cloneElement(children, {
    // We pass down the fact that the parent form was submitted to the nested form
    submitted,
    submits,
    reset,
    // Update is an internal method that is used to update the parent form
    update: ({ values, errors, successes, warnings, touched, asyncValidations }) => {

      const invalid = errors ? Object.keys(errors).some( k => errors[k]) : null;
      const success = successes ? Object.keys(successes).some( k => successes[k]) : null;
      const warning = warnings ? Object.keys(warnings).some( k => warnings[k]) : null;

      if (!_.isEqual(values, getValue())) {
        setValue(values);
      }
      if (touched !== getTouched())
        setTouched( touched );

      if (invalid) setError( invalid );
      if (warning) setWarning( warning );
      if (success) setSuccess( success );
      if ( asyncValidations > 0 ) {
        validatingField();
      }
      else {
        doneValidatingField();
      }
    },
    registerAsyncValidation
  });

};

const NestedForm = FormField(NestedFormWrapper);

export default NestedForm;
