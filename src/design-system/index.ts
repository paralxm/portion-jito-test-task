/**
 * Portion design system — public entry point.
 *
 * Only supported, reusable capabilities are exported here. Stories, fixtures, the
 * Storybook icon catalogue and feature adapters are deliberately not part of this surface.
 */

// Tokens (generated from tokens.json)
export { tokens, tokenVars, cssVar } from './tokens/generated/tokens';
export type { TokenPath } from './tokens/generated/tokens';

// Icons
export { Icon } from './icons/Icon';
export type { IconProps, IconSize } from './icons/Icon';

// Primitives
export { Text } from './primitives/Text/Text';
export type { TextProps, TextVariant, TextColor } from './primitives/Text/Text';
export { VisuallyHidden } from './primitives/VisuallyHidden/VisuallyHidden';
export { Stack, growClass } from './primitives/layout/Stack';
export type { SpaceStep, LayoutAlign, LayoutJustify, LayoutProps } from './primitives/layout/Stack';
export { Inline } from './primitives/layout/Inline';
export { Surface } from './primitives/Surface/Surface';
export type { SurfaceProps } from './primitives/Surface/Surface';
export { Separator } from './primitives/Separator/Separator';
export type { SeparatorProps } from './primitives/Separator/Separator';
export { Spinner } from './primitives/Spinner/Spinner';
export type { SpinnerProps } from './primitives/Spinner/Spinner';
export { Button } from './primitives/Button/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './primitives/Button/Button';
export { ProgressRing, progressRatio } from './primitives/ProgressRing/ProgressRing';
export type { ProgressRingProps, ProgressRingSize } from './primitives/ProgressRing/ProgressRing';
export { IconButton } from './primitives/IconButton/IconButton';
export type { IconButtonProps } from './primitives/IconButton/IconButton';
export { Input } from './primitives/Input/Input';
export type { InputProps } from './primitives/Input/Input';
export { Checkbox } from './primitives/Choice/Checkbox';
export type { CheckboxProps } from './primitives/Choice/Checkbox';
export { Radio } from './primitives/Choice/Radio';
export type { RadioProps } from './primitives/Choice/Radio';
export { Badge } from './primitives/Badge/Badge';
export type { BadgeProps } from './primitives/Badge/Badge';

// Nutrition presentation rules
export {
  NUTRIENT_CATEGORIES,
  MACRO_ORDER,
  NBSP,
  NOT_AVAILABLE,
  MISSING_GLYPH,
  formatQuantity,
  formatWithUnit,
  formatMaybe,
} from './nutrition/nutrition';
export type { NutrientUnit, NutrientCategory, NutrientCategoryMeta } from './nutrition/nutrition';

// Components
export { FormField } from './components/FormField/FormField';
export type { FormFieldProps, FormFieldRenderProps } from './components/FormField/FormField';
export { TextField } from './components/TextField/TextField';
export type { TextFieldProps } from './components/TextField/TextField';
export { AmountField } from './components/AmountField/AmountField';
export type { AmountFieldProps } from './components/AmountField/AmountField';
export { UnitControl } from './components/UnitControl/UnitControl';
export type { UnitControlProps } from './components/UnitControl/UnitControl';
export { SearchField } from './components/SearchField/SearchField';
export type { SearchFieldProps } from './components/SearchField/SearchField';
export { FilterChip, AppliedCriterionChip } from './components/Chip/Chip';
export type { FilterChipProps, AppliedCriterionChipProps } from './components/Chip/Chip';
export { SegmentedControl } from './components/SegmentedControl/SegmentedControl';
export type { SegmentedControlProps, SegmentedControlOption } from './components/SegmentedControl/SegmentedControl';
export { NutritionValue } from './components/NutritionValue/NutritionValue';
export type { NutritionValueProps, NutritionValueStatus, NutritionValueSize } from './components/NutritionValue/NutritionValue';
export { NutritionMacros } from './components/NutritionMacros/NutritionMacros';
export type { NutritionMacrosProps, MacroValue } from './components/NutritionMacros/NutritionMacros';
export { NutrientRow } from './components/NutrientRow/NutrientRow';
export type { NutrientRowProps } from './components/NutrientRow/NutrientRow';
export { MatchCriteria } from './components/MatchCriteria/MatchCriteria';
export type { MatchCriteriaProps, MatchCriterion } from './components/MatchCriteria/MatchCriteria';
export { MediaFrame } from './components/MediaFrame/MediaFrame';
export type { MediaFrameProps } from './components/MediaFrame/MediaFrame';
export { ResultsHeading } from './components/ResultsHeading/ResultsHeading';
export type { ResultsHeadingProps } from './components/ResultsHeading/ResultsHeading';
export { InlineMessage } from './components/InlineMessage/InlineMessage';
export type { InlineMessageProps, MessageTone } from './components/InlineMessage/InlineMessage';
export { EmptyState } from './components/EmptyState/EmptyState';
export type { EmptyStateProps } from './components/EmptyState/EmptyState';
export { LoadingState } from './components/LoadingState/LoadingState';
export type { LoadingStateProps } from './components/LoadingState/LoadingState';
export { MethodOption } from './components/MethodOption/MethodOption';
export type { MethodOptionProps } from './components/MethodOption/MethodOption';
export { FoodResultRow } from './components/FoodResultRow/FoodResultRow';
export type { FoodResultRowProps } from './components/FoodResultRow/FoodResultRow';

// Patterns
export { NavigationBar } from './patterns/NavigationBar/NavigationBar';
export type { NavigationBarProps, Destination } from './patterns/NavigationBar/NavigationBar';
export { AppHeader } from './patterns/AppHeader/AppHeader';
export type { AppHeaderProps } from './patterns/AppHeader/AppHeader';
export { ModalSheet } from './patterns/ModalSheet/ModalSheet';
export type { ModalSheetProps } from './patterns/ModalSheet/ModalSheet';
export { ConfirmDialog } from './patterns/ConfirmDialog/ConfirmDialog';
export type { ConfirmDialogProps } from './patterns/ConfirmDialog/ConfirmDialog';
export { MethodSheet } from './patterns/MethodSheet/MethodSheet';
export type { MethodSheetProps, EntryMethod } from './patterns/MethodSheet/MethodSheet';
export { UnitSheet } from './patterns/UnitSheet/UnitSheet';
export type { UnitSheetProps, UnitOption } from './patterns/UnitSheet/UnitSheet';
export { NutritionSummary } from './patterns/NutritionSummary/NutritionSummary';
export type { NutritionSummaryProps, AdditionalNutrition, NamedNutrient } from './patterns/NutritionSummary/NutritionSummary';
export { RecipeCard } from './patterns/RecipeCard/RecipeCard';
export type { RecipeCardProps } from './patterns/RecipeCard/RecipeCard';

// Templates
export { RootScreenLayout } from './templates/RootScreenLayout/RootScreenLayout';
export type { RootScreenLayoutProps } from './templates/RootScreenLayout/RootScreenLayout';
export { FocusedFlowLayout } from './templates/FocusedFlowLayout/FocusedFlowLayout';
export type { FocusedFlowLayoutProps } from './templates/FocusedFlowLayout/FocusedFlowLayout';
