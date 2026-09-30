import { t, useLocale } from "../../i18n/runtime";
import type { Questionnaire } from "../../types";
const questions = () =>
  [
    [
      "increased_pain",
      t("QuestionnaireFields.el_dolor_aumento_desde_tu_ultimo_registro"),
    ],
    ["fever", t("QuestionnaireFields.has_tenido_fiebre")],
    ["discharge", t("QuestionnaireFields.has_observado_secrecion")],
    ["odor", t("QuestionnaireFields.has_notado_mal_olor")],
    [
      "wound_opening",
      t("QuestionnaireFields.has_observado_que_la_herida_se_abrio"),
    ],
  ] as const;
export function QuestionnaireFields({
  value,
  onChange,
}: {
  value: Questionnaire;
  onChange: (value: Questionnaire) => void;
}) {
  useLocale();
  function set<K extends keyof Questionnaire>(
    field: K,
    next: Questionnaire[K],
  ) {
    onChange({ ...value, [field]: next });
  }
  return (
    <div className="questionnaire">
      <div className="form-grid">
        <label>
          {t("QuestionnaireFields.fecha_de_la_fotografia")}
          <input
            type="date"
            required
            max={new Date().toLocaleDateString("en-CA")}
            value={value.photo_date}
            onChange={(e) => set("photo_date", e.target.value)}
          />
        </label>
        <label>
          {t("QuestionnaireFields.dolor_actual")}
          <select
            value={value.pain ?? "unknown"}
            onChange={(e) =>
              set(
                "pain",
                e.target.value === "unknown" ? null : Number(e.target.value),
              )
            }
          >
            <option value="unknown">
              {t("QuestionnaireFields.no_lo_se_no_puedo_responder")}
            </option>
            {Array.from({ length: 11 }, (_, n) => (
              <option value={n} key={n}>
                {n}
                {n === 0
                  ? t("QuestionnaireFields.sin_dolor")
                  : n === 10
                    ? t("QuestionnaireFields.maximo_dolor_imaginable")
                    : ""}
              </option>
            ))}
          </select>
          <small>
            {t("QuestionnaireFields.escala_de_0_a_10_segun_lo_que_percibes")}
          </small>
        </label>
      </div>
      {questions().map(([field, label]) => (
        <fieldset className="question-row" key={field}>
          <legend>{label}</legend>
          <div className="choices">
            {[
              ["yes", t("QuestionnaireFields.si")],
              ["no", t("QuestionnaireFields.no")],
              ["unknown", t("QuestionnaireFields.no_lo_se")],
            ].map(([answer, text]) => (
              <label key={answer}>
                <input
                  type="radio"
                  name={field}
                  value={answer}
                  checked={
                    value[field] ===
                    (answer === "unknown" ? null : answer === "yes")
                  }
                  onChange={() =>
                    set(field, answer === "unknown" ? null : answer === "yes")
                  }
                />
                <span>{text}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <label>
        {t("QuestionnaireFields.que_cambio_desde_el_ultimo_registro")}
        <select
          value={value.changes}
          onChange={(e) =>
            set("changes", e.target.value as Questionnaire["changes"])
          }
        >
          <option value="unknown">
            {t("QuestionnaireFields.es_mi_primer_registro_no_lo_se")}
          </option>
          <option value="none">
            {t("QuestionnaireFields.no_observe_cambios")}
          </option>
          <option value="changed">
            {t("QuestionnaireFields.observe_cambios")}
          </option>
        </select>
      </label>
      <label>
        {t("QuestionnaireFields.describe_los_cambios_o_agrega_contexto")}{" "}
        {value.changes !== "changed" && (
          <span className="muted">{t("QuestionnaireFields.opcional")}</span>
        )}
        <textarea
          rows={3}
          maxLength={1000}
          required={value.changes === "changed"}
          value={value.changes_description}
          onChange={(e) => set("changes_description", e.target.value)}
          placeholder={t(
            "QuestionnaireFields.por_ejemplo_cuando_notaste_un_cambio_escribe_solo_lo_que_obs",
          )}
        />
        <small>
          {t("questionnaire.characters", {
            count: value.changes_description.length,
          })}
        </small>
      </label>
    </div>
  );
}
export function QuestionnaireSummary({ value }: { value: Questionnaire }) {
  useLocale();
  const answer = (v: boolean | null) =>
    v === null
      ? t("QuestionnaireFields.no_lo_sabe")
      : v
        ? t("QuestionnaireFields.si")
        : t("QuestionnaireFields.no");
  return (
    <dl className="answers">
      <div>
        <dt>{t("QuestionnaireFields.dolor_actual")}</dt>
        <dd>
          {value.pain === null
            ? t("QuestionnaireFields.no_lo_sabe")
            : `${value.pain} de 10`}
        </dd>
      </div>
      {questions().map(([field, label]) => (
        <div key={field}>
          <dt>{label}</dt>
          <dd>{answer(value[field])}</dd>
        </div>
      ))}
      <div>
        <dt>{t("QuestionnaireFields.cambios_reportados")}</dt>
        <dd>
          {
            {
              none: t("QuestionnaireFields.sin_cambios_observados"),
              changed: t("QuestionnaireFields.observo_cambios"),
              unknown: t("QuestionnaireFields.primer_registro_no_lo_sabe"),
            }[value.changes]
          }
        </dd>
      </div>
      {value.changes_description && (
        <div className="answer-wide">
          <dt>{t("QuestionnaireFields.descripcion_del_paciente")}</dt>
          <dd>{value.changes_description}</dd>
        </div>
      )}
    </dl>
  );
}
