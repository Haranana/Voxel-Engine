export type ActionButtonData = {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export type ActionButtonsPanelProps = {
  buttons: ActionButtonData[];
};

export function ActionButtonsPanel(props: ActionButtonsPanelProps) {
  return (
    <div className="ActionButtonsPanel">
      {props.buttons.map((button) => (
        <button
          key={button.id}
          onClick={button.onClick}
          disabled={button.disabled}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}