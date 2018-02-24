/* ---------- Imports ---------- */

// Import React
import React, { Component } from 'react';
import _ from 'underscore';

// Import PropTypes library
import PropTypes from 'prop-types';

import Utils from '../redux/utils';
import { cache2 } from '../polyfills/cache';

import DeprecatedFormField from './DeprecatedFormField';

/* ---------- Form Component ----------*/

function FormField(FormComponent, shouldComponentUpdate) {
  class ConnectedFormField extends Component {
    // update value locally, and debounce it sending to the form
    state = {
      value: this.context.formApi.getValue(this.props.field),
    };
    history = {};

    // We want to set touched to true when the form was submitted ( not for nested forms! )
    componentWillReceiveProps(nextProps, nextContext) {
      const nextApi = nextContext.formApi;
      const currentApi = this.context.formApi;
      if (
        (nextApi.submitted !== currentApi.submitted || nextApi.submits !== currentApi.submits) &&
        !this.props.nestedForm
      ) {
        currentApi.setTouched(this.props.field, true, false);
      }

      // check we need to update internal state from prop
      this.updateProp('value', () => nextContext.formApi.getValue(this.props.field));
    }

    updateProp(name, getter) {
      // update value if changed outside. form reset, as exemple
      const value = getter();

      const history = this.history[name] || (this.history[name] = []);

      const idx = history.indexOf(value);
      if (idx < 0) {
        this.setState({ [name]: value });
        history.length = 0;
      } else {
        history.splice(0, idx);
      }
    }
    historyProp(name, value) {
      const history = this.history[name] || (this.history[name] = []);
      history.push(value);
    }

    // Optimization to only rerender if nessisary
    shouldComponentUpdate(nextProps, nextState, nextContext) {

      // Grab needed values
      const field = this.props.field;
      const currentApi = this.context.formApi;
      const nextApi = nextContext.formApi;

      // TODO debug async error issue
      // console.log("WTF1", Utils.get( currentApi.errors, field ) );
      // console.log("WTF2", Utils.get( nextApi.errors, field ) );

      const shouldUpdate = this.state.value !== nextState.value ||
        (
          nextApi !== currentApi &&
          (Utils.get( nextApi.values, field ) !== Utils.get( currentApi.values, field ) ||
          Utils.get( nextApi.touched, field ) !== Utils.get( currentApi.touched, field ) ||
          Utils.get( nextApi.errors, field ) !== Utils.get( currentApi.errors, field ) ||
          Utils.get( nextApi.warnings, field ) !== Utils.get( currentApi.warnings, field ) ||
          Utils.get( nextApi.successes, field ) !== Utils.get( currentApi.successes, field ) ||
          Utils.get( nextApi.validating, field ) !== Utils.get( currentApi.validating, field ) ||
          Utils.get( nextApi.validationFailed, field ) !== Utils.get( currentApi.validationFailed, field ) ||
          nextApi.submits !== currentApi.submits)
        ) ||
        (shouldComponentUpdate && shouldComponentUpdate(this.props, nextProps)) ||
        !Utils.isShallowEqual(this.props.field, nextProps.field);

      return shouldUpdate;
    }

    realSetValue = _.debounce(
      (field, value) => this.context.formApi.setValue(field, value),
      this.context.formApi.debounce,
    );

    fieldApi = cache2(
      () => this.context.formApi,
      () => this.props.field,
      (formApi, field) => {
        // Build field api from form api
        const fieldApi = {
          registerAsyncValidation: formApi.registerAsyncValidation,
          submitted: formApi.submitted,
          submits: formApi.submits,
          getFieldName: () => field,
          setValue: (value) => {
            this.historyProp('value', value);
            this.setState({ value });
            this.realSetValue(field, value);
          },

          getValue: () => this.state.value,
        };
        [
          'setTouched',
          'setError',
          'setWarning',
          'setSuccess',
          'getTouched',
          'getError',
          'getWarning',
          'getSuccess',
          'validatingField',
          'doneValidatingField',
          'reset',
        ].forEach((func) => {
          fieldApi[func] = formApi[func].bind(formApi, field);
        });

        return fieldApi;
      },
    );

    render() {
      // console.log("RENDER FIELD", this.props.field);

      const { field, ...rest } = this.props;

      return <FormComponent fieldApi={this.fieldApi()} {...rest} />;
    }
  }

  ConnectedFormField.contextTypes = {
    formApi: PropTypes.object
  };

  // Handle deprecated usage
  if (typeof FormComponent === 'object') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using FormField directly as a component is deprecated. Please refer to the latest docs on new HOC usage.');
    }
    return (
      <DeprecatedFormField {...FormComponent} />
    );
  }

  return ConnectedFormField;
}


export default FormField;
