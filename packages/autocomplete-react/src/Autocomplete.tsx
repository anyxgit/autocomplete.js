/** @jsx h */

import { h } from 'preact';
import { useRef, useEffect } from 'preact/hooks';
import { createPortal } from 'preact/compat';

import {
  getDefaultProps,
  AutocompleteOptions,
  PublicAutocompleteOptions,
} from '@francoischalifour/autocomplete-core';
import { getHTMLElement } from './getHTMLElement';
import { SearchBox } from './SearchBox';
import { Dropdown } from './Dropdown';

import { useAutocomplete } from './useAutocomplete';
import { useDropdown } from './useDropdown';

interface PublicRendererProps {
  /**
   * The container for the autocomplete dropdown.
   */
  dropdownContainer?: string | HTMLElement;
  /**
   * The dropdown placement related to the container.
   */
  dropdownPlacement?: 'start' | 'end';
}

export interface RendererProps extends Required<PublicRendererProps> {
  dropdownContainer: HTMLElement;
}

interface PublicProps<TItem>
  extends PublicAutocompleteOptions<TItem>,
    PublicRendererProps {}

export function getDefaultRendererProps<TItem>(
  rendererProps: PublicRendererProps,
  autocompleteProps: AutocompleteOptions<TItem>
): RendererProps {
  return {
    dropdownContainer: rendererProps.dropdownContainer
      ? getHTMLElement(
          rendererProps.dropdownContainer,
          autocompleteProps.environment
        )
      : autocompleteProps.environment.document.body,
    dropdownPlacement: rendererProps.dropdownPlacement ?? 'start',
  };
}

export function Autocomplete<TItem extends {}>(
  providedProps: PublicProps<TItem>
) {
  const {
    dropdownContainer,
    dropdownPlacement,
    ...autocompleteProps
  } = providedProps;
  const props = getDefaultProps(autocompleteProps);
  const rendererProps = getDefaultRendererProps(
    { dropdownContainer, dropdownPlacement },
    props
  );

  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchBoxRef = useRef<HTMLFormElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [state, autocomplete] = useAutocomplete<TItem>(props);
  useDropdown<TItem>(rendererProps, state, searchBoxRef, dropdownRef);

  useEffect(() => {
    if (!(searchBoxRef.current && dropdownRef.current && inputRef.current)) {
      return undefined;
    }

    const { onTouchStart, onTouchMove } = autocomplete.getEnvironmentProps({
      searchBoxElement: searchBoxRef.current,
      dropdownElement: dropdownRef.current,
      inputElement: inputRef.current,
    });

    props.environment.addEventListener('touchstart', onTouchStart);
    props.environment.addEventListener('touchmove', onTouchMove);

    return () => {
      props.environment.removeEventListener('touchstart', onTouchStart);
      props.environment.removeEventListener('touchmove', onTouchMove);
    };
  }, [autocomplete, searchBoxRef, dropdownRef, inputRef, props.environment]);

  return (
    <div
      className={[
        'algolia-autocomplete',
        state.status === 'stalled' && 'algolia-autocomplete--stalled',
        state.status === 'error' && 'algolia-autocomplete--errored',
      ]
        .filter(Boolean)
        .join(' ')}
      {...autocomplete.getRootProps()}
    >
      <SearchBox
        searchBoxRef={searchBoxRef}
        inputRef={inputRef}
        dropdownRef={dropdownRef}
        placeholder={props.placeholder}
        query={state.query}
        isOpen={state.isOpen}
        status={state.status}
        completion={state.completion}
        getLabelProps={autocomplete.getLabelProps}
        getInputProps={autocomplete.getInputProps}
        {...autocomplete.getFormProps({
          inputElement: inputRef.current,
        })}
      />

      {createPortal(
        <Dropdown
          dropdownRef={dropdownRef}
          suggestions={state.suggestions}
          isOpen={state.isOpen}
          status={state.status}
          getItemProps={autocomplete.getItemProps}
          getMenuProps={autocomplete.getMenuProps}
        />,
        rendererProps.dropdownContainer
      )}
    </div>
  );
}