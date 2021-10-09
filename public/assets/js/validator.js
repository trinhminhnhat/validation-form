function Validator(options) {
    const selectorRules = {};
    const formElement = document.querySelector(options.form);
    
    function getParentElement(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    function validate(inputElement, rule) {
        const errorElement = getParentElement(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
        let errorMessage;
        
        // get all rules of selector
        const rules = selectorRules[rule.selector];
        for (let i = 0; i < rules.length; i++) {
            switch (inputElement.type) {
                case 'checkbox':
                case 'radio':
                    errorMessage = rules[i](formElement.querySelector(rule.selector + ':checked'));
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
                    break;
            }
            if (errorMessage) break;
        }

        if (errorMessage) {
            errorElement.innerText = errorMessage;
            getParentElement(inputElement, options.formGroupSelector).classList.add('invalid');
        } else {
            errorElement.innerText = '';
            getParentElement(inputElement, options.formGroupSelector).classList.remove('invalid');
        }

        return errorMessage;
    }
    
    if (formElement) {
        formElement.addEventListener('submit', (e) => {
            e.preventDefault();

            let isValidForm = true;
            options.rules.forEach(rule => {
                const inputElement = formElement.querySelector(rule.selector);
                let hasError = validate(inputElement, rule);
                if (hasError) {
                    isValidForm = false;
                }
            });

            if (isValidForm) {
                // submit form with ajax
                if (typeof options.onSubmit === 'function') {
                    let enableInputs = formElement.querySelectorAll('[name]:not([disabled])');
                 
                    const formValues = Array.from(enableInputs).reduce((values, input) => {
                        switch (input.type) {
                            case 'checkbox':
                                if (!input.matches(':checked')) {
                                    values[input.name] = '';
                                    return values;
                                }

                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                break;
                            case 'radio':
                                values[input.name] = formElement.querySelector(`input[name=${input.name}]:checked`).value;
                                break;
                            case 'file':
                                values[input.name] = input.files;
                            default:
                                values[input.name] = input.value;
                        }

                        return values;
                    }, {});

                    options.onSubmit(formValues);
                } 
                // submit form don't use ajax
                else {
                    formElement.submit();
                }
            } 

        });

        options.rules.forEach(rule => {
            // save rules for each input element
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            const inputElements = formElement.querySelectorAll(rule.selector);
            Array.from(inputElements).forEach(inputElement => {
                // handle when the user blur the input element
                inputElement.onblur = () => {
                    validate(inputElement, rule);
                }

                // handle when the input element is changed
                inputElement.oninput = () => {
                    const errorElement = getParentElement(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
                    errorElement.innerText = '';
                    getParentElement(inputElement, options.formGroupSelector).classList.remove('invalid');
                }
            })

        })
    }
}

Validator.isRequired = function(selector, message) {
    return {
        selector,
        test(value) {
            return value ? undefined : message || 'Please enter the value'
        }
    };
}

Validator.isEmail = function(selector, message) {
     return {
        selector,
        test(value) {
            const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return regex.test(value) ? undefined : message || 'Please enter a valid email address';
        }
    };
}

Validator.minLength = function(selector, min, message) {
    return {
        selector,
        test(value) {
            return value.length >= min ? undefined : message || `Please enter at least ${min} characters`;
        }
    };
}

Validator.checkMatching = function(selector, getConfirmValue, message) {
    return {
        selector,
        test(value) {
            return value === getConfirmValue() ? undefined : message || 'Please enter the same value';
        }
    };
}
