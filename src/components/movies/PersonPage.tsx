/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useParams, useNavigate } from "react-router-dom";
import PersonModal from "./PersonModal";

export default function PersonPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <PersonModal
      personId={id ? parseInt(id) : null}
      onClose={() => navigate(-1)}
    />
  );
}
