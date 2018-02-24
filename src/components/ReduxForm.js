/* ---------- Imports ---------- */

// Import React
import React, { Component } from 'react';
import _ from 'underscore';


// Import PropTypes library
import PropTypes from 'prop-types';

import thunkMiddleware from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { connect } from 'react-redux';
import { createLogger } from 'redux-logger';

import ReducerBuilder from '../redux/ReducerBuilder';
import * as actions from '../redux/actions';

import Utils from '../redux/utils';
import cache from '../polyfills/cache';

/* ----- Recursive Check to see if form is valid  -----*/

// TODO maybe a better way to do this
const isFormValid = (errors) => {
  if ( Array.isArray( errors ) ) {
    return errors.some( k => isFormValid( k ) );
  }
  else if ( errors !== null && typeof errors === 'object') {
    return Object.keys(errors).some( k => isFormValid( errors[k] ) );
  }
  return errors;
};

/* ---------- Helper Methods ----------*/
const newErrors = (state) => {
  return Object.assign(state.errors, state.asyncErrors);
};

const newWarnings = (state) => {
  return Object.assign(state.warnings, state.asyncWarnings);
};

const newSuccesses = (state) => {
  return Object.assign(state.successes, state.asyncSuccesses);
};

const newState = ( state ) => {
  return {
    ...state,
    errors: newErrors(state),
    warnings: newWarnings(state),
    successes: newSuccesses(state),
  };
};

class FormApi {
  constructor(form) {
    this.form = form;
    this.state = form.formState;
  }

  get submitForm() { return this.form.submitForm; }
  get setValue() { return this.form.setValue; }
  get getValue() { return this.form.getValue; }
  get setTouched() { return this.form.setTouched; }
  get getTouched() { return this.form.getTouched; }
  get getWarning() { return this.form.getWarning; }
  get getError() { return this.form.getError; }
  get getSuccess() { return this.form.getSuccess; }
  get getFormState() { return this.form.getFormState; }
  get setFormState() { return this.form.setFormState; }
  get setError() { return this.form.setError; }
  get setWarning() { return this.form.setWarning; }
  get setSuccess() { return this.form.setSuccess; }
  get format() { return this.form.format; }
  get reset() { return this.form.reset; }
  get resetAll() { return this.form.resetAll; }
  get clearAll() { return this.form.clearAll; }
  get validatingField() { return this.form.validatingField; }
  get doneValidatingField() { return this.form.doneValidatingField; }
  get registerAsyncValidation() { return this.form.registerAsyncValidation; }
  get addValue() { return this.form.addValue; }
  get removeValue() { return this.form.removeValue; }
  get setAllValues() { return this.form.setAllValues; }
  get setAllTouched() { return this.form.setAllTouched; }
  get swapValues() { return this.form.swapValues; }

  get errors() { return this.state.errors; }
  get warnings() { return this.state.warnings; }
  get successes() { return this.state.successes; }
  get values() { return this.state.values; }
  get touched() { return this.state.touched; }
  get asyncValidations() { return this.state.asyncValidations; }
  get validating() { return this.state.validating; }
  get validationFailures() { return this.state.validationFailures; }
  get validationFailed() { return this.state.validationFailed; }
  get submitted() { return this.state.submitted; }
  get submits() { return this.state.submits; }
  get submitting() { return this.state.submitting; }
  get debounce() { return this.form.props.debounce; }
}

/* ---------- Form Component ----------*/

class Form extends Component {

  constructor(props) {
    super(props);
    this.asyncValidators = [];

    // Unfortunately, babel has some stupid bug with auto-binding async arrow functions
    // So we still need to manually bind them here
    // https://github.com/gaearon/react-hot-loader/issues/391
    this.finishSubmission = this.finishSubmission.bind(this);
    this.setAllValues = this.setAllValues.bind(this);
    this.setAllTouched = this.setAllTouched.bind(this);
    this.callAsynchronousValidators = this.callAsynchronousValidators.bind(this);

  }

  getApi = cache(() => this.formState, () => new FormApi(this));
  get api() { return this.getApi(); }

  getChildContext() {
    return {
      formApi: this.api
    };
  }

  componentWillMount() {
    if (this.props.getApi) {
      this.props.getApi(this.api);
    }
  }

  componentDidMount() {
    if ( !this.props.dontValidateOnMount ) {
      // PreValidat
      this.props.dispatch(actions.preValidate());
      // Validate
      this.props.dispatch(actions.validate());
    }
    // Register async validators if you are a nested form ( only nested forms have registerAsync prop )
    if ( this.props.registerAsyncValidation ) {
      this.props.registerAsyncValidation( this.callAsynchronousValidators );
    }
  }

  componentWillReceiveProps(nextProps) {
    // If submits was incrimented
    if ( nextProps.submits > this.props.submits ) {
      this.validate();
      // Inciment submit
      this.props.dispatch(actions.submits());
    }
    const didUpdate = nextProps.formState !== this.props.formState;
    // Call form did update
    if ( this.props.formDidUpdate && didUpdate ) {
      this.props.formDidUpdate( newState( nextProps.formState ) );
    }
    // Call update function if it exists
    if ( this.props.update && didUpdate ) {
      this.props.update( newState( nextProps.formState ) );
    }
  }

  componentWillUnmount() {
    // Reset the form if it has reset
    if ( this.props.reset ) {
      // Basically calling parent forms reset function
      this.props.reset();
    }
  }

  validate = () => {
    const dispatch = this.props.dispatch;
    // PreValidate
    dispatch(actions.preValidate());
    // Validate
    dispatch(actions.validate());

  };

  get formState() {
    return this.props.formState;
  }

  dispatch(action) {
    this.props.dispatch(action);
  }

  getFormState = () => {
    return this.formState;
  }

  get errors() {
    return Object.assign(this.props.formState.errors, this.props.formState.asyncErrors);
  }

  get warnings() {
    return Object.assign(this.props.formState.warnings, this.props.formState.asyncWarnings);
  }

  get successes() {
    return Object.assign(this.props.formState.successes, this.props.formState.asyncSuccesses);
  }

  get currentState() {
    return Object.assign( this.formState, {
      errors: this.errors,
      warnings: this.warnings,
      successes: this.successes
    });
  }

  setValue = ( field, value ) => {
    const dispatch = this.props.dispatch;
    dispatch(actions.setValue(field, value));
    this.validate();
  };

  setTouched = ( field, touch = true, validate = true ) => {
    this.props.dispatch(actions.setTouched(field, touch));
    // We have a flag to perform async validate when touched
    if ( validate ) {
      this.props.dispatch(actions.asyncValidate(field, this.props.asyncValidators ));
    }
  }

  async setAllTouched( touched ) {
    const dispatch = this.props.dispatch;
    dispatch(actions.setAllTouched( touched ));
    dispatch(actions.preValidate());
    dispatch(actions.validate());
    // Build up list of async functions that need to be called
    const validators = this.props.asyncValidators ? Object.keys(this.props.asyncValidators).map( ( field ) => {
      return this.props.dispatch(actions.asyncValidate(field, this.props.asyncValidators ));
    }) : [];
    await Promise.all( validators );
  }

  setError = ( field, error ) => {
    this.props.dispatch(actions.setError(field, error));
  }

  setWarning = ( field, warning ) => {
    this.props.dispatch(actions.setWarning(field, warning));
  }

  setSuccess = ( field, success ) => {
    this.props.dispatch(actions.setSuccess(field, success));
  }

  async setAllValues( values ) {
    const dispatch = this.props.dispatch;
    dispatch(actions.setAllValues( values ));
    dispatch(actions.preValidate());
    dispatch(actions.validate());
    // Build up list of async functions that need to be called
    const validators = this.props.asyncValidators ? Object.keys(this.props.asyncValidators).map( ( field ) => {
      return this.props.dispatch(actions.asyncValidate(field, this.props.asyncValidators ));
    }) : [];
    await Promise.all( validators );
  }

  setFormState = ( formState ) => {
    this.props.dispatch( actions.setFormState( formState ) );
  }

  getTouched = ( field ) => {
    return Utils.get( this.formState.touched, field );
  }

  getValue = ( field ) => {
    return Utils.get( this.formState.values, field );
  }

  getError = ( field ) => {
    return Utils.get( this.errors, field );
  }

  getWarning = ( field ) => {
    return Utils.get( this.warnings, field );
  }

  getSuccess = ( field ) => {
    return Utils.get( this.successes, field );
  }

  addValue = ( field, value ) => {
    const dispatch = this.props.dispatch;
    dispatch(actions.setValue(field, [
      ...( Utils.get( this.props.formState.values, field ) || []),
      value,
    ]));
    dispatch(actions.removeAsyncError(field));
    dispatch(actions.removeAsyncWarning(field));
    dispatch(actions.removeAsyncSuccess(field));
    dispatch(actions.preValidate());
    dispatch(actions.validate());
  }

  removeValue = ( field, index ) => {
    const fieldValue = Utils.get( this.props.formState.values, field ) || [];
    const dispatch = this.props.dispatch;
    dispatch(actions.setValue( field, [
      ...fieldValue.slice(0, index),
      ...fieldValue.slice(index + 1)
    ]));
    const fieldTouched = Utils.get( this.props.formState.touched, field ) || [];
    dispatch(actions.setTouched( field, [
      ...fieldTouched.slice(0, index),
      ...fieldTouched.slice(index + 1)
    ]));
    dispatch(actions.removeAsyncError(field));
    dispatch(actions.removeAsyncWarning(field));
    dispatch(actions.removeAsyncSuccess(field));
    dispatch(actions.preValidate());
    dispatch(actions.validate());
  }

  swapValues = ( field, index, destIndex ) => {

    const min = Math.min(index, destIndex);
    const max = Math.max(index, destIndex);

    const fieldValues = Utils.get( this.props.formState.values, field ) || [];

    this.props.dispatch(actions.setValue(field, [
      ...fieldValues.slice(0, min),
      fieldValues[max],
      ...fieldValues.slice(min + 1, max),
      fieldValues[min],
      ...fieldValues.slice(max + 1),
    ] ));
  }

  registerAsyncValidation = ( func ) => {
    this.asyncValidators.push( func );
  }

  format = ( field, format ) => {
    const dispatch = this.props.dispatch;
    dispatch(actions.format(field, format));
    dispatch(actions.preValidate());
    dispatch(actions.validate());
  }

  reset = ( field ) => {
    this.props.dispatch(actions.reset(field));
  }

  resetAll = () => {
    this.props.dispatch(actions.resetAll());
  }

  clearAll = () => {
    this.props.dispatch(actions.clearAll());
  }

  // This is an internal method used by nested forms to tell the parent that its validating
  validatingField = ( field ) => {
    this.props.dispatch(actions.validatingField(field));
  }

  // This is an internal method used by nested forms to tell the parent that its done validating
  doneValidatingField = ( field ) => {
    this.props.dispatch(actions.doneValidatingField(field));
  }

  submitForm = ( e ) => {
    // Let the user know we are submitting
    const dispatch = this.props.dispatch;
    dispatch(actions.submitting(true));
    // PreValidate
    dispatch(actions.preValidate());
    // Validate
    dispatch(actions.validate());
    // update submits
    dispatch(actions.submits());
    // We prevent default, by default, unless override is passed
    if ( e && e.preventDefault && !this.props.dontPreventDefault ) {
      e.preventDefault(e);
    }
    // We need to prevent default if override is passed and form is invalid
    if ( this.props.dontPreventDefault ) {
      const invalid = isFormValid( this.errors );
      if ( invalid && e && e.preventDefault ) {
        e.preventDefault(e);
      }
    }
    this.finishSubmission(e);
  }

  async finishSubmission(e) {
    // Call asynchronous validators
    try {
      await this.callAsynchronousValidators();
    }
    catch (err) {
      // Let the user know we are done submitting
      this.props.dispatch(actions.submitting(false));
      throw err;
    }
    // Only submit if we have no errors
    const errors = this.errors;
    const invalid = isFormValid( errors );
    // Call on validation fail if we are invalid
    if ( invalid && this.props.onSubmitFailure ) {
      this.props.onSubmitFailure( errors, this.api );
    }
    // Only update submitted if we are not invalid and there are no active asynchronous validations
    if ( !invalid && this.formState.asyncValidations === 0 ) {
      let values = this.formState.values;
      // Call pre submit
      if ( this.props.preSubmit ) {
        values = this.props.preSubmit( values, this.api );
      }
      // Update submitted
      this.props.dispatch(actions.submitted());
      if ( this.props.onSubmit ) {
        this.props.onSubmit( values, e, this.api );
      }
    }
    // Let the user know we are done submitting
    this.props.dispatch(actions.submitting(false));
  }

  async callAsynchronousValidators() {
    // Build up list of async functions that need to be called
    let validators = this.props.asyncValidators ? Object.keys(this.props.asyncValidators).map( ( field ) => {
      return this.props.dispatch(actions.asyncValidate(field, this.props.asyncValidators ));
    }) : [];
    const childValidators = this.asyncValidators ? this.asyncValidators.map( ( validator ) => {
      // This looks strange but you call an async function to generate a promise
      return validator();
    }) : [];
    // Add all other subscribed validators to the validators list
    validators = validators.concat(childValidators);
    // Call all async validators
    await Promise.all( validators );
  }

  render() {

    const {
      children,
      component,
      render
    } = this.props;

    if ( component ) {
      return React.createElement(component, { formApi: this.api } );
    }

    if ( render ) {
      return render(this.api);
    }

    if ( typeof children === 'function' ) {
      return children(this.api);
    }

    return React.cloneElement(children, { formApi: this.api } );

  }

}

Form.childContextTypes = {
  formApi: PropTypes.object
};

/* ---------- Container ---------- */

const mapStateToProps = state => ({
  formState: state
});

const mapDispatchToProps = dispatch => ({
  dispatch
});

const FormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Form);

/* ---------- Exports ---------- */
class ReduxForm extends Component {

  constructor(props) {
    super(props);
    const {
      validateError,
      validateWarning,
      validateSuccess,
      preValidate,
      defaultValues
    } = props;

    this.store = createStore(
      ReducerBuilder.build( { validateError, validateWarning, validateSuccess, preValidate, defaultValues } ),
      applyMiddleware(
        thunkMiddleware, // lets us dispatch() functions
        // createLogger() // neat middleware that logs actions
      )
    );
  }

  render() {

    const {
      children,
      ...rest
    } = this.props;

    return (
      <FormContainer store={this.store} {...rest}>
        {children}
      </FormContainer>
    );
  }
}


export default ReduxForm;
